<?php

namespace App\Socialite;

use Laravel\Socialite\Two\ProviderInterface;
use SocialiteProviders\Manager\OAuth2\AbstractProvider;
use SocialiteProviders\Manager\OAuth2\User;

class XenforoProvider extends AbstractProvider implements ProviderInterface
{
    /**
     * Unique Provider Identifier.
     */
    const IDENTIFIER = 'xenforo';

    const ADMIN_ROLE = 3;

    public static function additionalConfigKeys()
    {
        return ['xenforo_url'];
    }

    protected $scopeSeparator = " ";
    /**
     * {@inheritdoc}
     */
    protected $scopes = ['read', 'post', 'usercp', 'conversate', 'admincp'];
    /**
     * {@inheritdoc}
     */
    
    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase($this->config['xenforo_url'] . 'oauth/authorize', $state);
    }
    /**
     * {@inheritdoc}
     */
    protected function getTokenUrl()
    {
        return $this->config['xenforo_url'] . 'oauth/token';
    }
    /**
     * {@inheritdoc}
     */
    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get($this->config['xenforo_url'] . 'users/me?oauth_token='. $token);

        return json_decode($response->getBody(), true);
    }
    /**
     * {@inheritdoc}
     */
    protected function mapUserToObject(array $user)
    {
        return (new User())->setRaw($user)->map([
            'id'       => $user['user']['user_id'],
            'nickname' => $user['user']['username'],
            'name'     => $user['user']['username'],
            'email'    => $user['user']['user_email'],
            'avatar'   => $user['user']['links']['avatar'] ? : null,
        ]);
    }
    /**
     * {@inheritdoc}
     */
    protected function getTokenFields($code)
    {
        return array_merge(parent::getTokenFields($code), [
            'grant_type' => 'authorization_code'
        ]);
    }
}