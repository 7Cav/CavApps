"use client";
import { useState, useRef, useEffect } from "react";
import {
  Award,
  Ribbon,
  Medal,
  MedalWithValor,
  MedalTiered,
  RibbonDonationLogic,
} from "./AwardClasses";
import { combatBadgeImagePath } from "./constants";

function Canvas(props) {
  const canvasRef = useRef(null);
  const data = props.data;

  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [builderErrors, setBuilderErrors] = useState([]);

  useEffect(() => {
    setLoading(true);
    setImages({});
    setBuilderErrors([]);

    const loadImage = (src, key) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ key, image: img });
        img.onerror = () =>
          reject({ key, error: new Error(`Failed to load image: ${src}`) });
        img.src = src;
      });
    };

    let imagePromises = [
      loadImage("/skunkworks/uniformBase/uniformBase.png", "uniformBase"),
      loadImage(
        "/skunkworks/uniformBase/uniformRightLapel.png",
        "uniformLapel",
      ),
      loadImage(
        `skunkworks/uniformEpaulettes/${data[0].rankGrade}.png`,
        "uniformEpaulette",
      ),
      loadImage(
        "skunkworks/uniformRibbons/ribbons/ribbonSpriteSheet.png",
        "ribbonSprites",
      ),
      loadImage(
        "skunkworks/uniformRibbons/ribbons/unitCitationSprite.png",
        "citationSprites",
      ),
      loadImage(
        "skunkworks/uniformMedals/medalSpriteSheet.png",
        "medalSprites",
      ),
      loadImage("skunkworks/uniformTabs/tabSpriteSheet.png", "tabSprites"),
    ];

    if (data[4] != null) {
      imagePromises.push(
        loadImage(combatBadgeImagePath(data[4].imageNum), "uniformCombatBadge"),
      );
    }

    Promise.all(imagePromises)
      .then((loadedImages) => {
        const imagesMap = loadedImages.reduce((acc, { key, image }) => {
          acc[key] = image;
          return acc;
        }, {});
        setImages(imagesMap);
        setLoading(false);
      })
      .catch((errors) => {
        console.error("Error loading images:", errors);
        setLoading(false); // Important: Set loading to false even on error
      });
  }, [data]);

  const placeRibbon = (data, ribbonSprites, coordData, context) => {
    return new Promise((resolve) => {
      const ribbonWidth = 43;
      const ribbonHeight = 14;
      const desiredX = coordData.dx;
      const desiredY = coordData.dy;
      const ribbonSelection = data.awardPriority;

      if (data.awardPriority == 0) {
        resolve();
        return;
      }

      const drawRibbon = () => {
        // Function to draw the base ribbon
        context.drawImage(
          ribbonSprites,
          0,
          ribbonSelection * ribbonHeight,
          ribbonWidth,
          ribbonHeight,
          desiredX,
          desiredY,
          ribbonWidth,
          ribbonHeight,
        );
      };

      if (
        data.ribbonDisplayedAttachmentCount !== 0 ||
        (data instanceof MedalWithValor && data.hasValorDevice == true)
      ) {
        const attachmentType = data.ribbonAttachmentType;
        const attachmentCount = data.ribbonDisplayedAttachmentCount.toString();
        const ribbonAttachment = new Image();

        ribbonAttachment.onload = () => {
          drawRibbon(); //Draw the ribbon first
          context.drawImage(
            ribbonAttachment,
            0,
            0,
            ribbonWidth,
            ribbonHeight,
            desiredX,
            desiredY,
            ribbonWidth,
            ribbonHeight,
          );
          resolve(); // Resolve AFTER drawing BOTH ribbon and attachment
        };
        ribbonAttachment.onerror = () => {
          console.error("Error loading ribbon attachment");
          drawRibbon(); //Draw the ribbon even if attachment fails
          resolve();
        };
        ribbonAttachment.src = `skunkworks/uniformRibbons/attachments/${attachmentType}/${attachmentCount}.png`;
      } else {
        drawRibbon(); //Draw the ribbon if no attachment
        resolve(); // Resolve immediately if no attachment
      }
    });
  };

  const placeCitation = (data, ribbonSprites, coordData, context) => {
    return new Promise((resolve) => {
      const ribbonWidth = 43;
      const ribbonHeight = 17;
      const desiredX = coordData.dx;
      const desiredY = coordData.dy;
      const ribbonSelection = data.awardPriority;

      const drawRibbon = () => {
        // Function to draw the base ribbon
        context.drawImage(
          ribbonSprites,
          0,
          ribbonSelection * ribbonHeight,
          ribbonWidth,
          ribbonHeight,
          desiredX,
          desiredY,
          ribbonWidth,
          ribbonHeight,
        );
      };

      if (data.ribbonDisplayedAttachmentCount !== 0) {
        const attachmentType = data.ribbonAttachmentType;
        const attachmentCount = data.ribbonDisplayedAttachmentCount.toString();
        const ribbonAttachment = new Image();

        ribbonAttachment.onload = () => {
          drawRibbon(); //Draw the ribbon first
          context.drawImage(
            ribbonAttachment,
            0,
            0,
            ribbonWidth,
            ribbonHeight,
            desiredX,
            desiredY,
            ribbonWidth,
            ribbonHeight,
          );
          resolve(); // Resolve AFTER drawing BOTH ribbon and attachment
        };
        ribbonAttachment.onerror = () => {
          console.error("Error loading ribbon attachment");
          drawRibbon(); //Draw the ribbon even if attachment fails
          resolve();
        };
        ribbonAttachment.src = `skunkworks/uniformRibbons/attachments/${attachmentType}/${attachmentCount}.png`;
      } else {
        drawRibbon(); //Draw the ribbon if no attachment
        resolve(); // Resolve immediately if no attachment
      }
    });
  };

  const placeInfantryBadge = (image, coordData, context) => {
    return new Promise((resolve) => {
      if (image == undefined) {
        resolve();
        return;
      }

      const desiredX = coordData.dx;
      const desiredY = coordData.dy;

      const drawBadge = () => {
        // Function to draw the base ribbon
        context.drawImage(image, desiredX, desiredY);
      };
      drawBadge();
      resolve();
    });
  };

  const placeMedal = (data, medalSprites, context, xCoord, yCoord) => {
    return new Promise((resolve) => {
      const ribbonWidth = 70;
      const ribbonHeight = 120;
      const ribbonSelection = data.medalPriority;

      const drawMedal = () => {
        // Function to draw the base ribbon
        context.drawImage(
          medalSprites,
          0,
          (ribbonSelection - 2) * ribbonHeight,
          ribbonWidth,
          ribbonHeight,
          xCoord,
          yCoord,
          ribbonWidth,
          ribbonHeight,
        );
      };

      if (
        data.ribbonDisplayedAttachmentCount !== 0 ||
        (data instanceof MedalWithValor && data.hasValorDevice == true)
      ) {
        const attachmentType = data.ribbonAttachmentType;
        const attachmentCount = data.ribbonDisplayedAttachmentCount.toString();
        const ribbonAttachment = new Image();

        ribbonAttachment.onload = () => {
          drawMedal(); //Draw the ribbon first
          context.drawImage(
            ribbonAttachment,
            0,
            0,
            ribbonWidth,
            ribbonHeight,
            xCoord + 13,
            yCoord + 7,
            ribbonWidth,
            ribbonHeight,
          );
          resolve(); // Resolve AFTER drawing BOTH ribbon and attachment
        };
        ribbonAttachment.onerror = () => {
          console.error("Error loading ribbon attachment");
          drawMedal(); //Draw the ribbon even if attachment fails
          resolve();
        };
        ribbonAttachment.src = `skunkworks/uniformRibbons/attachments/${attachmentType}/${attachmentCount}.png`;
      } else {
        drawMedal(); //Draw the ribbon if no attachment
        resolve(); // Resolve immediately if no attachment
      }
    });
  };

  const drawSpecialMedal = (data, context) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
        resolve(); // Resolve AFTER loading and drawing
      };
      img.onerror = () => {
        console.error(
          `Error loading special award image: skunkworks/uniformSpecialMedals/${data.awardPriority}.png`,
        );
        resolve(); // Resolve even on error
      };
      img.src = `skunkworks/uniformSpecialMedals/${data.awardPriority}.png`;
    });
  };

  const drawGeneric = (image, context) => {
    return new Promise((resolve) => {
      context.drawImage(image, 0, 0);
      resolve();
    });
  };

  const placeServiceStripes = (userData, context) => {
    return new Promise((resolve) => {
      let stripeWidth;
      let stripeHeight;

      if (userData.yearsInServiceCoordArray[0] == "officer") {
        stripeWidth = 50;
        stripeHeight = 9;
      } else {
        stripeWidth = 40;
        stripeHeight = 50;
      }

      const img = new Image();
      img.onload = () => {
        for (let i = 1; i <= userData.yearsInService; i++) {
          context.drawImage(
            img,
            0,
            0,
            stripeWidth,
            stripeHeight,
            userData.yearsInServiceCoordArray[i].dx,
            userData.yearsInServiceCoordArray[i].dy,
            stripeWidth,
            stripeHeight,
          );
        }
        resolve();
      };

      img.onerror = () => {
        console.error(
          `Error loading service stripe image: skunkworks/uniformService/${userData.yearsInServiceCoordArray[0]}/serviceStripe.png`,
        );
        resolve(); // Resolve even on error
      };
      img.src = `skunkworks/uniformService/${userData.yearsInServiceCoordArray[0]}/serviceStripe.png`;
    });
  };

  const placeNameTag = (userData, context) => {
    return new Promise((resolve) => {
      let tagWidth;
      let tagHeight;
      let selector;
      let dx;
      let fontSize = 18;
      const dy = 313;

      if (userData.nameTag.length < 9) {
        tagWidth = 101;
        tagHeight = 40;
        selector = "short";
        dx = 203;
      } else {
        tagWidth = 131;
        tagHeight = 40;
        selector = "long";
        dx = 188;
      }

      const img = new Image();
      img.onload = () => {
        context.drawImage(
          img,
          0,
          0,
          tagWidth,
          tagHeight,
          dx,
          dy,
          tagWidth,
          tagHeight,
        );
        if (userData.nameTag.length > 10) {
          fontSize = 18 - (userData.nameTag.length - 10) * 2;
        }

        context.font = `normal condensed bold ${fontSize}px 'Arial Narrow'`;
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(userData.nameTag, dx + tagWidth / 2, dy + 18);
        resolve();
      };

      img.onerror = () => {
        console.error(
          `Error loading name tag: skunkworks/uniformNameTag/${selector}.png`,
        );
        resolve(); // Resolve even on error
      };
      img.src = `skunkworks/uniformNameTag/${selector}.png`;
    });
  };

  const placeWeaponQual = (data, xPosition, selector, context) => {
    return new Promise((resolve) => {
      const rootWidth = 71;
      const rootHeight = 85;
      const plateWidth = 68;
      const plateHeight = 36;
      let dx = xPosition;

      const img = new Image();
      img.onload = () => {
        // Draw the root image
        const rootY = 576 - (data.length - 1) * (plateHeight - 10);
        context.drawImage(
          img,
          0,
          0,
          rootWidth,
          rootHeight,
          dx,
          rootY,
          rootWidth,
          rootHeight,
        );

        const initialPlateY = rootY + rootHeight - 10;
        const platePromises = [];

        for (let i = 0; i < data.length; i++) {
          const currentPlateY = initialPlateY + i * (plateHeight - 10);

          const img2 = new Image();
          const platePromise = new Promise((resolvePlate) => {
            img2.onload = () => {
              context.drawImage(
                img2,
                0,
                0,
                plateWidth,
                plateHeight,
                dx,
                currentPlateY,
                plateWidth,
                plateHeight,
              );
              resolvePlate(); // Resolve the plate promise when the image is loaded and drawn
            };
            img2.onerror = () => {
              console.error(
                `Error loading weapon qual plate: skunkworks/uniformWeaponQuals/plates/${data[i]}.png`,
              );
              resolvePlate();
            };
            img2.src = `skunkworks/uniformWeaponQuals/plates/${data[i]}.png`;
          });
          platePromises.push(platePromise);
        }

        Promise.all(platePromises).then(() => {
          resolve();
        });
      };

      img.onerror = () => {
        console.error(
          `Error loading weapon qual root: skunkworks/uniformWeaponQuals/root/${selector}.png`,
        );
        resolve();
      };
      img.src = `skunkworks/uniformWeaponQuals/root/${selector}.png`;
    });
  };

  const placeTab = (data, tabSprites, coordData, context) => {
    return new Promise((resolve) => {
      const tabWidth = 75;
      const tabHeight = 34;
      const desiredX = coordData.dx;
      const desiredY = coordData.dy;
      const tabSelection = data.awardPriority;

      const drawTab = () => {
        // Function to draw the base ribbon
        context.drawImage(
          tabSprites,
          0,
          tabSelection * tabHeight,
          tabWidth,
          tabHeight,
          desiredX,
          desiredY,
          tabWidth,
          tabHeight,
        );
      };

      drawTab();
      resolve();
    });
  };

  const placeCordPins = (imgPath, context) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);
        resolve(); // Resolve AFTER loading and drawing
      };
      img.onerror = () => {
        console.error(`Error Loading Cord Pin`);
        resolve(); // Resolve even on error
      };
      img.src = imgPath;
    });
  };

  useEffect(() => {
    if (
      !loading &&
      images.uniformBase &&
      images.uniformLapel &&
      images.uniformEpaulette &&
      images.ribbonSprites &&
      images.citationSprites &&
      images.medalSprites &&
      images.tabSprites
    ) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

      const drawLayers = async () => {
        context.drawImage(images.uniformBase, 0, 0);

        // First, draw all ribbons, unit citations and the infantry badge.
        await Promise.all([
          ...data[1]
            .slice(0, data[0].ribbonMedalCount)
            .map((ribbonData, index) =>
              placeRibbon(
                ribbonData,
                images.ribbonSprites,
                data[0].ribbonCoordArray[index],
                context,
              ),
            ),
          ...data[2]
            .slice(0, data[0].unitCitationCount)
            .map((ribbonData, index) =>
              placeCitation(
                ribbonData,
                images.citationSprites,
                data[0].unitCitationCoordArray[index],
                context,
              ),
            ),
          placeInfantryBadge(
            // Include the infantry badge promise here
            images.uniformCombatBadge,
            data[0].combatBadgeCoords,
            context,
          ),
        ]);

        //Draw the lapel and the epaulette
        await Promise.all([
          drawGeneric(images.uniformLapel, context),
          drawGeneric(images.uniformEpaulette, context),
        ]);

        //Draw Service Stripes
        if (data[0].yearsInService) {
          await Promise.all([placeServiceStripes(data[0], context)]);
        }

        //Draw Name Tag, 8 or more chars requires long boi

        try {
          if (data[0].nameTag.length > 15)
            throw new Error(
              "Name Tag exceeds allowable length. You must add the name tag manually in the .xcf file.",
            );
          await Promise.all([placeNameTag(data[0], context)]);
        } catch (err) {
          setBuilderErrors((prevErrors) => [...prevErrors, err.message]);
        }

        //Draw Weapon Quals

        try {
          if (data[5] !== 0) {
            const uniqueEntries = new Set();
            const activeQuals = [];
            if (data[5].expertQuals.length > 0) {
              activeQuals.push({ type: "expert", data: data[5].expertQuals });
              for (let i = 0; i < data[5].expertQuals.length; i++) {
                uniqueEntries.add(data[5].expertQuals[i]);
              }
            }
            if (data[5].sharpshooterQuals.length > 0) {
              activeQuals.push({
                type: "sharpshooter",
                data: data[5].sharpshooterQuals,
              });
              for (let i = 0; i < data[5].sharpshooterQuals.length; i++) {
                uniqueEntries.add(data[5].sharpshooterQuals[i]);
              }
            }

            if (data[5].marksmanQuals.length > 0) {
              activeQuals.push({
                type: "marksman",
                data: data[5].marksmanQuals,
              });
              for (let i = 0; i < data[5].marksmanQuals.length; i++) {
                uniqueEntries.add(data[5].marksmanQuals[i]);
              }
            }

            let checksum = 0;

            if (activeQuals[0]) checksum += activeQuals[0].data.length;
            if (activeQuals[1]) checksum += activeQuals[1].data.length;
            if (activeQuals[2]) checksum += activeQuals[2].data.length;

            if (checksum != uniqueEntries.size) {
              throw new Error(
                "Weapon Qual Checksum Failed. This is due to a double entry in the Milpac and cannot be fixed by you. Inform your lead if you see this error.",
              );
            }

            const numActive = activeQuals.length;

            const xPositions = [];
            if (numActive === 1) {
              xPositions.push(25);
            } else if (numActive === 2) {
              xPositions.push(25, 97);
            } else if (numActive === 3) {
              xPositions.push(25, 97, 170);
            }

            //Draw each active qualification

            await Promise.all([
              ...activeQuals.map((activeQuals, index) =>
                placeWeaponQual(
                  activeQuals.data,
                  xPositions[index],
                  activeQuals.type,
                  context,
                ),
              ),
            ]);
          }
        } catch (err) {
          setBuilderErrors((prevErrors) => [...prevErrors, err.message]);
        }

        // Draw tabs

        if (data[6].length > 0) {
          await Promise.all([
            ...data[6].map((tabData, index) =>
              placeTab(
                tabData,
                images.tabSprites,
                data[0].tabCoordArray[index],
                context,
              ),
            ),
          ]);
        }

        //Before drawing MOS Decorations, Do a check

        try {
          if (data[0].mosCheck != null) {
            throw new Error(data[0].mosCheck[1]);
          }

          // Draw Cord

          if (data[0].shoulderCord != false) {
            await Promise.all([
              placeCordPins(
                `skunkworks/uniformCords/${data[0].shoulderCord}.png`,
                context,
              ),
            ]);
          }

          // Draw Neck Pins

          if (data[0].neckPins != false) {
            await Promise.all([
              placeCordPins(
                `skunkworks/uniformLapelPins/${data[0].neckPins}.png`,
                context,
              ),
            ]);
          }
        } catch (err) {
          setBuilderErrors((prevErrors) => [...prevErrors, err.message]);
        }

        //Calculate medal coords
        //TODO MOVE THIS WHOLE THING OUT OF THIS DAMN CANVAS FUNCTION

        //Scale & Layout Constants
        const scale = 1.0; // Adjust to scale overall dimensions if needed

        const canvasWidth = canvas.width;
        const borderWidth = 25;
        const offsetX = borderWidth + 4;
        const offsetY = 745;

        const medalWidth = 70 * scale;
        const medalHeight = 120 * scale;
        const medalSpacing = -5 * scale;

        const staggerOffset = (medalWidth + medalSpacing) / 2;

        const validMedals = data[3].filter(
          (m) => m.awardPriority !== 0 && m.awardPriority !== 1,
        );
        const totalValidMedals = validMedals.length;
        const baseRowSpacing = totalValidMedals > 23 ? 65 : 130;
        const rowSpacing = baseRowSpacing * scale;

        const hasThirdRow = totalValidMedals > 23;

        // Capacities dynamically swap based on whether Row 3 is needed
        // This is a hack fix. We want the second row to shift only if there is a row 3
        const ROW_CAPACITIES = hasThirdRow ? [12, 11, 12] : [12, 12, 12];

        const specialMedals = [];
        const rows = [[], [], []];

        let validIndex = 0;

        data[3].forEach((medalData) => {
          if (medalData.awardPriority === 0 || medalData.awardPriority === 1) {
            specialMedals.push(medalData);
            return;
          }

          // Determine row and column dynamically based on variable row capacities
          let remainingIndex = validIndex;
          let row = 0;
          let col = 0;

          for (let r = 0; r < ROW_CAPACITIES.length; r++) {
            if (remainingIndex < ROW_CAPACITIES[r]) {
              row = r;
              col = remainingIndex;
              break;
            }
            remainingIndex -= ROW_CAPACITIES[r];

            // If index exceeds max capacity across all 3 rows (35 total), stop placing
            if (r === ROW_CAPACITIES.length - 1) return;
          }

          // Calculate coordinates
          let xPos = offsetX + col * (medalWidth + medalSpacing);
          let yPos = offsetY + row * rowSpacing;

          // Apply stagger shift exclusively to Row 2 and only if there is a third row
          if (row === 1 && hasThirdRow) {
            xPos += staggerOffset;
          }

          rows[row].push({
            data: medalData,
            x: Math.floor(xPos),
            y: Math.floor(yPos),
          });

          validIndex++;
        });

        // Draw the medals

        try {
          if (totalValidMedals > ROW_CAPACITIES.reduce((a, b) => a + b, 0)) {
            throw new Error(
              "Medal count exceeds max allowable limit. This is a priority error, and must be submitted to your S1 Chain of Command",
            );
          }

          await Promise.all(
            specialMedals.map((medalData) =>
              drawSpecialMedal(medalData, context),
            ),
          );

          for (let r = 2; r >= 0; r--) {
            await Promise.all(
              rows[r].map((item) =>
                placeMedal(
                  item.data,
                  images.medalSprites,
                  context,
                  item.x,
                  item.y,
                  medalWidth,
                  medalHeight,
                ),
              ),
            );
          }
        } catch (err) {
          setBuilderErrors((prevErrors) => [...prevErrors, err.message]);
        }

        canvas.toBlob(function (blob) {
          canvasDownload.href = URL.createObjectURL(blob);
        });
      };
      drawLayers();
    }
  }, [loading, images, data]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="canvasreturn">
      <a id="canvasDownload" href="#" download>
        Download Image
      </a>
      {builderErrors.length > 0 && (
        <div className="errorbox">
          <h3 className="errorheader">Errors have been detected!</h3>
          <ul>
            {builderErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <p>The uniform has rendered with non failing items.</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        {...props}
        width={837}
        height={1025}
        className="canvas"
      />
    </div>
  );
}

export default Canvas;
