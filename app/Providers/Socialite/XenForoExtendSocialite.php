<?php

namespace App\Socialite;

use SocialiteProviders\Manager\SocialiteWasCalled;

class XenForoExtendSocialite
{
    /**
     * Execute the provider.
     *
     * @param SocialiteWasCalled $socialiteWasCalled
     *
     * @throws \SocialiteProviders\Manager\Exception\InvalidArgumentException
     */
    public function handle(SocialiteWasCalled $socialiteWasCalled)
    {
        $socialiteWasCalled->extendSocialite('xenforo', __NAMESPACE__.'\XenforoProvider');
    }
}
